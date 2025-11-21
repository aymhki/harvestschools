import {useTranslation} from "react-i18next";

function NotFound() {

    const {t} = useTranslation();

  return (
    <div>
      <h1>
        {t("common.not-found-message")}
      </h1>
    </div>
  );
}

export default NotFound;