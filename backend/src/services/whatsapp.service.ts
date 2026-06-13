export type SendWhatsAppParams = {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  text: string;
};

export type SendWhatsAppResult = {
  whatsappMsgId: string | null;
  success: boolean;
  error?: string;
};

export async function sendWhatsAppMessage(params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
  const { phoneNumberId, accessToken, to, text } = params;
  const phone = to.replace(/\D/g, '');

  try {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: text },
        }),
      }
    );

    const data = (await response.json()) as {
      messages?: { id: string }[];
      error?: { message: string };
    };

    if (!response.ok) {
      return {
        whatsappMsgId: null,
        success: false,
        error: data.error?.message ?? `WhatsApp API error ${response.status}`,
      };
    }

    return {
      whatsappMsgId: data.messages?.[0]?.id ?? null,
      success: true,
    };
  } catch (error) {
    console.error('WhatsApp send failed:', error);
    return { whatsappMsgId: null, success: false, error: 'Failed to send WhatsApp message' };
  }
}
