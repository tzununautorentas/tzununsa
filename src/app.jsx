import React from "react"
import { T } from "./config.js"

export default function App() {
  return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: T.acc, fontSize: 32, fontWeight: 800 }}>
        Tz'unun cargando...
      </div>
    </div>
  )
}
