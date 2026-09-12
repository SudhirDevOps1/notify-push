# NotifyPush PHP Client

Universal, lightweight push notification client for Laravel, Symfony, WordPress, and vanilla PHP.

---

## Installation via Composer

```bash
composer require notifypush/client
```

---

## 1. Vanilla PHP Example

```php
<?php
require_once __DIR__ . '/vendor/autoload.php';

use NotifyPush\NotifyPush;

$client = new NotifyPush(
    serverUrl: 'https://ntfy.sh',
    topic: 'my-alerts-channel'
);

$success = $client->send(
    title: '🔔 New Contact Inquiry',
    message: 'John Doe submitted the inquiry form from landing page.',
    priority: 'high',
    tags: ['envelope', 'sparkles'],
    clickUrl: 'https://crm.company.com/leads/8192'
);

if ($success) {
    echo "Notification successfully delivered!\n";
}
```

---

## 2. Laravel Custom Notification Channel

```php
// app/Notifications/OrderCreatedNotification.php
namespace App\Notifications;

use Illuminate\Notifications\Notification;
use NotifyPush\NotifyPush;

class OrderCreatedNotification extends Notification
{
    private $order;

    public function __construct($order)
    {
        $this->order = $order;
    }

    public function via($notifiable)
    {
        return ['notifypush'];
    }

    public function toNotifyPush($notifiable)
    {
        $client = new NotifyPush(
            serverUrl: config('services.notifypush.server'),
            topic: config('services.notifypush.topic')
        );

        $client->send(
            title: "💰 Order #{$this->order->id} Paid",
            message: "Amount: {$this->order->currency} {$this->order->total}",
            priority: 'high',
            tags: ['moneybag', 'white_check_mark'],
            clickUrl: route('orders.show', $this->order->id)
        );
    }
}
```
