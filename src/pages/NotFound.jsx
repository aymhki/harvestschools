import {useTranslation} from "react-i18next";
import '../styles/NotFound.css'

function NotFound() {

    const {t} = useTranslation('common');

  return (
    <div className="not-found-page">
      <h2>
        {t("common.not-found-message")}
      </h2>
    </div>
  );
}

export default NotFound;