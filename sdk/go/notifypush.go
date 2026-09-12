package notifypush

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

type Action struct {
	Action string // "view", "http", "broadcast"
	Label  string
	URL    string
	Method string
}

type Client struct {
	ServerURL  string
	Topic      string
	Token      string
	HTTPClient *http.Client
}

func NewClient(serverURL, topic, token string) *Client {
	if serverURL == "" {
		serverURL = os.Getenv("NOTIFY_SERVER")
		if serverURL == "" {
			serverURL = "https://ntfy.sh"
		}
	}
	if topic == "" {
		topic = os.Getenv("NOTIFY_TOPIC")
	}
	if token == "" {
		token = os.Getenv("NOTIFY_TOKEN")
	}

	return &Client{
		ServerURL: strings.TrimRight(serverURL, "/"),
		Topic:     topic,
		Token:     token,
		HTTPClient: &http.Client{
			Timeout: 4 * time.Second,
		},
	}
}

func (c *Client) Send(ctx context.Context, title, body, priority string, tags []string, actions []Action) error {
	if c.Topic == "" {
		return fmt.Errorf("notifypush: no topic configured")
	}

	reqURL := fmt.Sprintf("%s/%s", c.ServerURL, c.Topic)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, reqURL, bytes.NewBufferString(body))
	if err != nil {
		return err
	}

	req.Header.Set("Title", title)
	if priority != "" {
		req.Header.Set("Priority", priority)
	}
	req.Header.Set("Content-Type", "text/plain; charset=utf-8")

	if c.Token != "" {
		req.Header.Set("Authorization", "Bearer "+c.Token)
	}
	if len(tags) > 0 {
		req.Header.Set("Tags", strings.Join(tags, ","))
	}
	if len(actions) > 0 {
		var actParts []string
		for _, a := range actions {
			actParts = append(actParts, fmt.Sprintf("action=%s, label=%s, url=%s", a.Action, a.Label, a.URL))
		}
		req.Header.Set("Actions", strings.Join(actParts, "; "))
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("notifypush network error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("notifypush returned status: %d", resp.StatusCode)
	}
	return nil
}
