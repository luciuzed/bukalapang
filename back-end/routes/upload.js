const express = require('express')
const fs = require('fs')
const path = require('path')
const db = require('../config/database')

const router = express.Router()

const uploadsDir = process.env.UPLOADS_DIR || path.resolve(__dirname, '../../dev-storage/uploads')
const paymentQrDir = process.env.PAYMENT_QR_DIR || path.resolve(__dirname, '../../dev-storage/qr')
fs.mkdirSync(uploadsDir, { recursive: true })
fs.mkdirSync(paymentQrDir, { recursive: true })

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png']
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png']

const resolvePaymentQrFilePath = (imageUrl) => {
  if (typeof imageUrl !== 'string' || !imageUrl.startsWith('/qr/')) {
    return null
  }

  const fileName = path.basename(imageUrl)
  const extension = path.extname(fileName).toLowerCase()

  if (!fileName || !ALLOWED_EXTENSIONS.includes(extension)) {
    return null
  }

  return path.join(paymentQrDir, fileName)
}

const resolveUploadFilePath = (imageUrl) => {
  if (typeof imageUrl !== 'string' || !imageUrl.startsWith('/uploads/')) {
    return null
  }

  const fileName = path.basename(imageUrl)
  const extension = path.extname(fileName).toLowerCase()

  if (!fileName || !ALLOWED_EXTENSIONS.includes(extension)) {
    return null
  }

  return path.join(uploadsDir, fileName)
}

const generateRandomString = (length = 15) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let output = ''

  for (let i = 0; i < length; i += 1) {
    output += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return output
}

router.post('/uploads', async (req, res) => {
  const { fileName, mimeType, base64Data } = req.body || {}

  if (!fileName || !mimeType || !base64Data) {
    return res.status(400).json({ error: 'Missing file data' })
  }

  const inputExtension = path.extname(fileName).toLowerCase()

  if (!ALLOWED_MIME_TYPES.includes(mimeType) || !ALLOWED_EXTENSIONS.includes(inputExtension)) {
    return res.status(400).json({ error: 'only .jpg .jpeg and .png allowed' })
  }

  try {
    const extension = inputExtension === '.png' ? '.png' : inputExtension === '.jpeg' ? '.jpeg' : '.jpg'
    const finalFileName = `${generateRandomString(15)}${extension}`
    const filePath = path.join(uploadsDir, finalFileName)
    const buffer = Buffer.from(base64Data, 'base64')

    await fs.promises.writeFile(filePath, buffer)

    res.status(201).json({
      fileName: finalFileName,
      imageUrl: `/uploads/${finalFileName}`,
    })
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ error: 'Failed to upload image' })
  }
})

router.delete('/uploads', async (req, res) => {
  const { imageUrl } = req.body || {}
  const filePath = resolveUploadFilePath(imageUrl)

  if (!filePath) {
    return res.status(400).json({ error: 'Invalid image URL' })
  }

  try {
    await fs.promises.unlink(filePath)
    return res.json({ message: 'Image deleted successfully' })
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.json({ message: 'Image already deleted' })
    }

    console.error('Delete upload error:', err)
    return res.status(500).json({ error: 'Failed to delete image' })
  }
})

router.get('/payment-qr/admin/:adminId', async (req, res) => {
  const { adminId } = req.params
  const parsedAdminId = Number(adminId)

  if (!Number.isInteger(parsedAdminId) || parsedAdminId < 1) {
    return res.status(400).json({ error: 'Invalid adminId' })
  }

  try {
    const [adminRows] = await db.execute('SELECT id FROM admin WHERE id = ?', [parsedAdminId])

    if (!adminRows.length) {
      return res.status(404).json({ error: 'Admin not found' })
    }

    const [fieldRows] = await db.execute(
      `SELECT qr_url
       FROM field
       WHERE admin_id = ? AND qr_url IS NOT NULL AND qr_url <> ''
       ORDER BY id DESC
       LIMIT 1`,
      [parsedAdminId]
    )

    const imageUrl = fieldRows[0]?.qr_url || null
    return res.json({ imageUrl })
  } catch (err) {
    console.error('Fetch admin payment QR error:', err)
    return res.status(500).json({ error: 'Failed to fetch payment QR' })
  }
})

router.post('/payment-qr/admin/:adminId', async (req, res) => {
  const { adminId } = req.params
  const { fileName, mimeType, base64Data } = req.body || {}
  const parsedAdminId = Number(adminId)

  if (!Number.isInteger(parsedAdminId) || parsedAdminId < 1) {
    return res.status(400).json({ error: 'Invalid adminId' })
  }

  if (!fileName || !mimeType || !base64Data) {
    return res.status(400).json({ error: 'Missing file data' })
  }

  const inputExtension = path.extname(fileName).toLowerCase()

  if (!ALLOWED_MIME_TYPES.includes(mimeType) || !ALLOWED_EXTENSIONS.includes(inputExtension)) {
    return res.status(400).json({ error: 'only .jpg .jpeg and .png allowed' })
  }

  try {
    const [adminRows] = await db.execute('SELECT id FROM admin WHERE id = ?', [parsedAdminId])

    if (!adminRows.length) {
      return res.status(404).json({ error: 'Admin not found' })
    }

    const [fieldExistRows] = await db.execute(
      'SELECT id FROM field WHERE admin_id = ? LIMIT 1',
      [parsedAdminId]
    )

    if (!fieldExistRows.length) {
      return res.status(400).json({ error: 'Please create a field first before uploading QR' })
    }

    const [previousQrRows] = await db.execute(
      `SELECT DISTINCT qr_url
       FROM field
       WHERE admin_id = ? AND qr_url IS NOT NULL AND qr_url <> ''`,
      [parsedAdminId]
    )

    const extension = inputExtension === '.png' ? '.png' : inputExtension === '.jpeg' ? '.jpeg' : '.jpg'
    const finalFileName = `${generateRandomString(15)}${extension}`
    const filePath = path.join(paymentQrDir, finalFileName)
    const buffer = Buffer.from(base64Data, 'base64')
    const nextImageUrl = `/qr/${finalFileName}`

    await fs.promises.writeFile(filePath, buffer)

    await db.execute(
      'UPDATE field SET qr_url = ? WHERE admin_id = ?',
      [nextImageUrl, parsedAdminId]
    )

    for (const row of previousQrRows) {
      const previousImageUrl = row.qr_url
      if (!previousImageUrl || previousImageUrl === nextImageUrl) {
        continue
      }

      const previousFilePath = resolvePaymentQrFilePath(previousImageUrl)
      if (!previousFilePath) {
        continue
      }

      try {
        await fs.promises.unlink(previousFilePath)
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error('Delete previous payment QR error:', err)
        }
      }
    }

    return res.status(201).json({
      imageUrl: nextImageUrl,
    })
  } catch (err) {
    console.error('Upload payment QR error:', err)
    return res.status(500).json({ error: 'Failed to upload payment QR' })
  }
})

router.delete('/payment-qr/admin/:adminId', async (req, res) => {
  const { adminId } = req.params
  const parsedAdminId = Number(adminId)

  if (!Number.isInteger(parsedAdminId) || parsedAdminId < 1) {
    return res.status(400).json({ error: 'Invalid adminId' })
  }

  try {
    const [adminRows] = await db.execute('SELECT id FROM admin WHERE id = ?', [parsedAdminId])

    if (!adminRows.length) {
      return res.status(404).json({ error: 'Admin not found' })
    }

    const [previousQrRows] = await db.execute(
      `SELECT DISTINCT qr_url
       FROM field
       WHERE admin_id = ? AND qr_url IS NOT NULL AND qr_url <> ''`,
      [parsedAdminId]
    )

    await db.execute(
      'UPDATE field SET qr_url = NULL WHERE admin_id = ?',
      [parsedAdminId]
    )

    for (const row of previousQrRows) {
      const previousImageUrl = row.qr_url
      const previousFilePath = resolvePaymentQrFilePath(previousImageUrl)

      if (!previousFilePath) {
        continue
      }

      try {
        await fs.promises.unlink(previousFilePath)
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error('Delete payment QR file error:', err)
        }
      }
    }

    return res.json({ message: 'Payment QR deleted successfully' })
  } catch (err) {
    console.error('Delete payment QR error:', err)
    return res.status(500).json({ error: 'Failed to delete payment QR' })
  }
})

router.get('/payment-qr/by-payment/:paymentId', async (req, res) => {
  const { paymentId } = req.params
  const normalizedPaymentId = String(paymentId || '').trim()
  const PAYMENT_ID_PATTERN = /^[a-zA-Z0-9]{12}$/

  if (!PAYMENT_ID_PATTERN.test(normalizedPaymentId)) {
    return res.status(400).json({ error: 'Invalid paymentId' })
  }

  try {
    const [rows] = await db.execute(
      `SELECT f.admin_id
       FROM payment p
       JOIN booking b ON p.booking_id = b.id
       JOIN booking_slot bs ON bs.booking_id = b.id
       JOIN field_slot fs ON fs.id = bs.slot_id
       JOIN field f ON f.id = fs.field_id
       WHERE p.id = ?
       LIMIT 1`,
      [normalizedPaymentId]
    )

    if (!rows.length) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    const adminId = Number(rows[0].admin_id)

    const [qrRows] = await db.execute(
      `SELECT qr_url
       FROM field
       WHERE admin_id = ? AND qr_url IS NOT NULL AND qr_url <> ''
       ORDER BY id DESC
       LIMIT 1`,
      [adminId]
    )

    const imageUrl = qrRows[0]?.qr_url || null
    return res.json({ imageUrl })
  } catch (err) {
    console.error('Fetch payment QR by payment error:', err)
    return res.status(500).json({ error: 'Failed to fetch payment QR' })
  }
})

module.exports = router