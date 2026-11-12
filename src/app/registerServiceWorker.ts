import { registerSW } from "virtual:pwa-register";
const updateSW = registerSW({
  onNeedRefresh() {
    if (window.confirm("Доступно обновление приложения. Обновить?"))
      void updateSW(true);
  },
});
