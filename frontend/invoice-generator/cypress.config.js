import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    // The Vite dev server. Specs may still use absolute URLs, but having this
    // set means cy.visit('/dashboard') and cy.request('/...') resolve here
    // instead of silently failing.
    baseUrl: "http://localhost:5173",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
