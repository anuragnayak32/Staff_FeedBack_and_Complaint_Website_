import './globals.css'

export const metadata = {
  title: 'Staff_Feedback_and_Complaint_Management_Platform',
  description: 'A transparent, accountable staff feedback and complaint management platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
