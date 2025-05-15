import React from 'react';

const SendWhatsAppReminder = () => {
  const sendReminder = async () => {
    const accessToken =  'EAAHwbR1fvgsBOwUInBvR1SGmVLSZCpDZAkn9aZCDJYaT0h5cwyiLyIq7BnKmXAgNs0ZCC8C33UzhGWTlwhUarfbcVoBdkc1bhuxZBXvroCHiXNwZCZBVxXlZBdinVoVnTB7IC1OYS4lhNEQprXm5l0XZAICVYISvkfwTEju6kV4Aqzt4lPpN8D3FD7eIWXDhnA4SG6QZDZD'; // Replace with your Meta API token
    const phoneNumberId = '527476310441806';
    const recipientPhoneNumber = '7208553985'; // Must be in international format

    const imageUrl =
      'https://firebasestorage.googleapis.com/v0/b/monthlymeetingapp.appspot.com/o/MonthlyMeeting%2FPUqR2hHzvzDj4NBHZ2os%2FWhatsApp%2F1745233511988_android-chrome-512x512.png?alt=media&token=3287bff6-d07f-424c-977f-889bfd4284a9';
    const bodyText = 'This is your daily reminder to complete your tasks.';

    const payload = {
      messaging_product: 'whatsapp',
      to: recipientPhoneNumber,
      type: 'template',
      template: {
        name: 'daily_reminder',
        language: {
          code: 'en',
        },
        components: [
          {
            type: 'header',
            parameters: [
              {
                type: 'image',
                image: {
                  link: imageUrl,
                },
              },
            ],
          },
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: bodyText,
              },
            ],
          },
        ],
      },
    };

    try {
      console.log('Sending WhatsApp Template Message...');
      console.log('Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('WhatsApp API Response:', result);

      if (response.ok && result.messages) {
        alert('Reminder sent!');
      } else {
        alert('Message failed to send. Check console for details.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send reminder.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Send Daily WhatsApp Reminder</h2>
      <button onClick={sendReminder} style={{ padding: '10px 20px', fontSize: '16px' }}>
        Send Reminder
      </button>
    </div>
  );
};

export default SendWhatsAppReminder;
