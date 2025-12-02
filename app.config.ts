// app.config.js
export default ({ config }) => {
    return {
      ...config,
      extra: {
        BACKEND_URL: "https://cae53881aa39.ngrok-free.app", // change to your backend URL
      },
    };
  };