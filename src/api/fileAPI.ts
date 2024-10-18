import { headers } from "next/headers";
import { post } from ".";
import { ApiUrlEnum } from "../utils/enums";

interface UploadAvatarResponse {
  url: string;
  // добавьте другие поля, если они есть в ответе
}

export default {
  uploadAvatar: (file: File): Promise<UploadAvatarResponse> => {
    const formData = new FormData();
    formData.append("avatar", file);

    return post(ApiUrlEnum.uploadAvatar, {
      headers: null,
      body: formData,
    });
  },
};
