// app.config.js
export default ({ config }) => {
    return {
      ...config,
      extra: {
        BACKEND_URL: "https://03430b25ab5a.ngrok-free.app", // change to your backend URL
      },
    };
  };