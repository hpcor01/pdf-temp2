// services/clipdropService.ts

const API_KEY = import.meta.env.VITE_CLIPDROP_API_KEY;

if (!API_KEY) {
  throw new Error("ClipDrop API Key not found");
}

/**
 * Converte URL -> Blob -> Base64
 */
export const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Remove o fundo (ClipDrop / Stability AI)
 */
export const removeBackground = async (imageUrl: string): Promise<string> => {
  const base64 = await urlToBase64(imageUrl);

  const formData = new FormData();
  formData.append("image_file", base64ToFile(base64, "input.png"));

  const response = await fetch(
    "https://api.stability.ai/v2beta/image/edit/remove-background",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("ClipDrop Error:", error);
    throw new Error("Erro ao remover fundo da imagem");
  }

  const blob = await response.blob();
  const processedBase64 = await blobToBase64(blob);

  return processedBase64; // já vem no formato data:image/png;base64,...
};

/**
 * ClipDrop NÃO possui "enhance image" oficial,
 * mas podemos usar o Upscale (melhora nitidez e qualidade)
 */
export const enhanceImage = async (imageUrl: string): Promise<string> => {
  const base64 = await urlToBase64(imageUrl);

  const formData = new FormData();
  formData.append("image_file", base64ToFile(base64, "input.png"));

  const response = await fetch(
    "https://api.stability.ai/v2beta/image/edit/upscale",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("ClipDrop Enhance Error:", error);
    throw new Error("Erro ao aprimorar imagem");
  }

  const blob = await response.blob();
  const processedBase64 = await blobToBase64(blob);

  return processedBase64;
};

/** Utilitários internos */
const base64ToFile = (base64: string, filename: string): File => {
  const byteString = atob(base64);
  const array = new Uint8Array(byteString.length);

  for (let i = 0; i < byteString.length; i++) {
    array[i] = byteString.charCodeAt(i);
  }

  return new File([array], filename, { type: "image/png" });
};

const blobToBase64 = async (blob: Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};
