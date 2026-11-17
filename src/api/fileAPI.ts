import { post } from ".";
import { ApiUrlEnum } from "../utils/enums";

interface UploadAvatarResponse {
  avatarUrl: string;
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  uploadAvatar: (file: File): Promise<UploadAvatarResponse> => {
    const formData = new FormData();
    formData.append("avatar", file);

    return post<UploadAvatarResponse>(ApiUrlEnum.uploadAvatar, formData);
  },
};
