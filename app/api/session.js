import axiosInstance from "../../config/axiosConfig";

/**
 * POST /api/deliveryRider/session/start
 * Start a new online session (idempotent — resumes if one exists).
 */
export const startOnlineSession = async () => {
  try {
    const response = await axiosInstance.post("/deliveryRider/session/start");
    return response.data;
  } catch (error) {
    console.error("❌ startOnlineSession:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * POST /api/deliveryRider/session/end
 * End the active online session.
 */
export const endOnlineSession = async () => {
  try {
    const response = await axiosInstance.post("/deliveryRider/session/end");
    return response.data;
  } catch (error) {
    console.error("❌ endOnlineSession:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * GET /api/deliveryRider/session/history
 * Get paginated session history + active session.
 */
export const getSessionHistory = async (page = 1, limit = 10) => {
  try {
    const response = await axiosInstance.get(
      `/deliveryRider/session/history?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("❌ getSessionHistory:", error.response?.data || error.message);
    throw error;
  }
};
