// app.config.js
export default ({ config }) => {
    return {
      ...config,
      extra: {
        BACKEND_URL: "https://df7a968d111c.ngrok-free.app", // change to your backend URL
      },
    };
  };
 