/* 原站把二进制资源塞在 <script id="pack"> 里，再用 document.currentScript.photos 交给应用。
   这里拆成独立文件：base64 -> Uint8Array -> window.PET_ASSETS，app.js 开头一行对应改成 window.PET_ASSETS。 */
(() => {
  const data = window.PET_ASSETS_DATA;
  const bytes = atob(data.bin);
  const photos = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) photos[i] = bytes.charCodeAt(i);
  window.PET_ASSETS = { photos, directory: data.directory };
})();
