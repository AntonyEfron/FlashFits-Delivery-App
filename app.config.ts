// app.config.js
export default ({ config }) => {
    return {
      ...config,
      extra: {
        BACKEND_URL: "https://84907e02d7e9.ngrok-free.app", // change to your backend URL
      },
    };
  };