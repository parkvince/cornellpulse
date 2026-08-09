import { build, preview } from "vite"

export default async function globalSetup() {
  await build()
  const server = await preview({
    preview: {
      host: "127.0.0.1",
      port: 4173,
      strictPort: true,
    },
  })

  return async () => {
    // Playwright's Windows webServer child-process teardown could leave the
    // Vite listener alive after every test passed. Owning Vite in global setup
    // lets teardown close all keep-alive sockets before closing the listener.
    server.httpServer.closeIdleConnections?.()
    server.httpServer.closeAllConnections?.()
    await server.close()
  }
}
