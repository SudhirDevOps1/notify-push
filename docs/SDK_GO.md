# notifypush Go Client

Production-grade, context-aware push notification client for Golang backends and microservices.

---

## Installation

```bash
go get github.com/SudhirDevOps1/notify-push/sdk/go
```

---

## Usage Example

```go
package main

import (
	"context"
	"log"
	"time"

	notifypush "github.com/SudhirDevOps1/notify-push/sdk/go"
)

func main() {
	client := notifypush.NewClient("https://ntfy.sh", "ops-database-alerts", "")

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	err := client.Send(
		ctx,
		"🚨 Deadlock Detected",
		"PostgreSQL transaction deadlock detected on table 'invoices'",
		"urgent",
		[]string{"warning", "skull"},
		[]notifypush.Action{
			{
				Action: "view",
				Label:  "Open Grafana",
				URL:    "https://grafana.internal/dashboard",
			},
		},
	)

	if err != nil {
		log.Fatalf("Push failed: %v", err)
	}

	log.Println("Push sent successfully!")
}
```
