import "./globals.css";
import "./app.css";

export const metadata = {
  title: "IncidentMind — AI Incident Response with Hindsight Memory",
  description:
    "IncidentMind uses Hindsight persistent memory to recall previous production incidents and power faster resolutions with Groq AI-driven structured analysis.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
