export const buildInfo = {
  version: import.meta.env.VITE_APP_VERSION || "0.1.0",
  commit: import.meta.env.VITE_GIT_COMMIT || "local",
  repositoryUrl:
    import.meta.env.VITE_REPOSITORY_URL || "https://github.com/baditaflorin/local-notion-ai",
  paypalUrl: import.meta.env.VITE_PAYPAL_URL || "https://www.paypal.com/paypalme/florinbadita"
};
