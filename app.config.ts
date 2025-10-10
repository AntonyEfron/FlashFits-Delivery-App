// app.config.js
export default ({ config }) => {
    return {
      ...config,
      extra: {
        BACKEND_URL: "https://fb00e6783483.ngrok-free.app", // change to your backend URL
      },
    };
  };
 