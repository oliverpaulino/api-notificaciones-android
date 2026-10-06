/// <reference types="node" />
import { handle } from "hono/vercel"
import { Hono } from 'hono'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

// 1. Inicializar Firebase Admin con tu llave
if (!getApps().length) {
  if (!process.env.FIREBASE_CREDS) {
    throw new Error("Falta la variable FIREBASE_CREDS en Vercel");
  }

  const serviceAccount = JSON.parse(process.env.FIREBASE_CREDS);

  initializeApp({
    credential: cert(serviceAccount)
  });
}

const app = new Hono()

app.post('/notificar', async (c) => {
  try {
    const body = await c.req.json()
    const { token, titulo, mensaje } = body

    if (!token || !titulo || !mensaje) {
      return c.json({ error: "Faltan datos (token, titulo, mensaje)" }, 400)
    }

    const payload = {
      notification: {
        title: titulo,
        body: mensaje
      },
      token: token
    }

    // 3. Enviar a Google FCM
    const response = await getMessaging().send(payload)
    console.log('Notificación enviada con éxito:', response)

    return c.json({ success: true, messageId: response })
  } catch (error) {
    console.error('Error enviando notificación:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

export default app