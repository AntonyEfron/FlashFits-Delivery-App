// app.config.js
export default ({ config }) => {
    return {
      ...config,
      extra: {
        BACKEND_URL: "https://5eba71aa4387.ngrok-free.app", // change to your backend URL
      },
    };
  };
 