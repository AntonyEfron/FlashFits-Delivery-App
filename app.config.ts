// app.config.js
export default ({ config }) => {
    return {
      ...config,
      extra: {
        BACKEND_URL: "https://b65aea9fc66c.ngrok-free.app", // change to your backend URL
      },
    };
  };
 