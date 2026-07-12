import axiosInstance from "../../config/axiosConfig";

export const getNotifications = async () => {
    try {
        const response = await axiosInstance.get("/deliveryRider/notifications");
        return response.data;
    } catch (error) {
        console.error("Error fetching notifications", error);
        throw error;
    }
};

export const markNotificationAsRead = async (id) => {
    try {
        const response = await axiosInstance.patch(`/deliveryRider/notifications/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error marking notification as read", error);
        throw error;
    }
};
