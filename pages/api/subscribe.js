import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:ruchitagodse217@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const subscription = req.body;

    try {
      await webpush.sendNotification(subscription, JSON.stringify({
        title: 'Hello!',
        body: 'Thanks for subscribing!',
      }));
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('Push Error:', err);
      res.status(500).json({ error: 'Push failed' });
    }
  } else {
    res.status(405).end();
  }
}
