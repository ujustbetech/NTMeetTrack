import React from 'react';

const SendWhatsAppThankYou = () => {
  const sendMessage = async () => {
    const accessToken =  'EAAHwbR1fvgsBOwUInBvR1SGmVLSZCpDZAkn9aZCDJYaT0h5cwyiLyIq7BnKmXAgNs0ZCC8C33UzhGWTlwhUarfbcVoBdkc1bhuxZBXvroCHiXNwZCZBVxXlZBdinVoVnTB7IC1OYS4lhNEQprXm5l0XZAICVYISvkfwTEju6kV4Aqzt4lPpN8D3FD7eIWXDhnA4SG6QZDZD'; // Replace with your Meta API token
    const phoneNumberId = '527476310441806';
    const recipientPhoneNumber = '919372321663';       // Include country code (India = 91)

    const payload = {
        messaging_product: 'whatsapp',
        to: recipientPhoneNumber,
        type: 'template',
        template: {
          name: 'thankyou',
          language: {
            code: 'en',
          },
          components: [
            {
              type: 'body',
              parameters: [], // No variables used in your template body
            }
            // ❌ DO NOT add button component if URL is static!
          ],
        },
      };
    //   const payload = {
    //     messaging_product: 'whatsapp',
    //     to: recipientPhoneNumber,
    //     type: 'template',
    //     template: {
    //       name: 'thankyou',
    //       language: {
    //         code: 'en',
    //       },
    //       components: [
    //         {
    //           type: 'body',
    //           parameters: [] // If your body has variables, put them here
    //         },
    //         {
    //           type: 'button',
    //           sub_type: 'url',
    //           index: '0',
    //           parameters: [
    //             {
    //               type: 'text',
    //               text: 'dynamic-part', // Replace with the value to substitute {{1}} in your URL
    //             },
    //           ],
    //         },
    //       ],
    //     },
    //   };
      
    try {
      console.log('Sending WhatsApp Template Message...');
      console.log('Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(
        `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      console.log('WhatsApp API Response:', result);

      if (response.ok && result.messages) {
        alert('Message sent successfully!');
      } else {
        alert('Message failed to send. See console for details.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Send Thank You WhatsApp Message</h2>
      <button
        onClick={sendMessage}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#25D366',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Send WhatsApp Message
      </button>
    </div>
  );
};

export default SendWhatsAppThankYou;
