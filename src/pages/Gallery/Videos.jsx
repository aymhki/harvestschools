import '../../styles/Gallery.css'
import {Helmet} from "react-helmet-async";

function Videos() {
  return (
    <div className={'gallery-videos-page'}>
        <Helmet>
            <title>Harvest International School | Gallery | Videos</title>
            <meta name="description"
                  content="Take a look at memories, demos, tours, and more videos and photos of Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords"
                  content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Gallery, Photos, Videos, 360 Tour, Memories, Demos, Tours, معرض, صور, فيديوهات, جولة 360, ذكريات, عروض, جولات"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <div className={'extreme-padding-container  make-this-container-have-gaps'}>
            <h1>
                Videos
            </h1>

            <div className={"gallery-videos-page-video-and-title-container"}>
                <iframe src="https://www.youtube-nocookie.com/embed/oJFon8c_CHg?si=o2IdQQ8vsQoCmSi3"
                        title="Harvest Schools Bazzar 2019"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        className={"gallery-videos-page-video-iframe"}
                        referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>

                <h2 className="gallery-videos-page-video-title">
                    Harvest Schools Bazzar 2019
                </h2>
            </div>

            <div className={"gallery-videos-page-video-and-title-container"}>

                <iframe
                    src="https://www.youtube-nocookie.com/embed/fYd0ehjZIN4?si=wl5PbnOxGDhT9aQ_"
                    title="YouTube video player" frameBorder="0"
                    className={"gallery-videos-page-video-iframe"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>

                <h2 className="gallery-videos-page-video-title">
                    STEM Projects
                </h2>

            </div>

            <div className={"gallery-videos-page-video-and-title-container"}>

                <iframe src="https://www.youtube-nocookie.com/embed/bulPAc8toXQ?si=xgSNVSIr-G6r38jZ"
                        title="YouTube video player" frameBorder="0"
                        className={"gallery-videos-page-video-iframe"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>

                <h2 className="gallery-videos-page-video-title">
                    Graduation Party 2019
                </h2>

            </div>

            <div className={"gallery-videos-page-video-and-title-container"}>
                <iframe
                    src="https://www.youtube-nocookie.com/embed/4dWifSjSH3o?si=Ho57jQ4QCC7tha7Z"
                    title="YouTube video player" frameBorder="0"
                    className={"gallery-videos-page-video-iframe"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>

                <h2 className="gallery-videos-page-video-title">
                    No Bullying Interview
                </h2>
            </div>

            <div className={"gallery-videos-page-video-and-title-container"}>

                <iframe
                    src="https://www.youtube-nocookie.com/embed/97Wc5Aycfu8?si=a7aP0RbH0E-c3cBf"
                    title="YouTube video player" frameBorder="0"
                    className={"gallery-videos-page-video-iframe"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>

                <h2 className="gallery-videos-page-video-title">
                    Students Union Meet Up
                </h2>
            </div>

            <div className={"gallery-videos-page-video-and-title-container"}>

                <iframe
                    src="https://www.youtube-nocookie.com/embed/jLGsKYl7Eo8?si=rX5ZN-Fj4CbOT9ou"
                    title="YouTube video player" frameBorder="0"
                    className={"gallery-videos-page-video-iframe"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>

                <h2 className="gallery-videos-page-video-title">
                    Harvest Academy Announcement
                </h2>
            </div>


            <div className={"gallery-videos-page-video-and-title-container"}>

                <iframe
                        src="https://www.youtube-nocookie.com/embed/1gAhyGvLhGg?si=EHNcKEcAdX5mmQy7"
                        title="YouTube video player" frameBorder="0"
                        className={"gallery-videos-page-video-iframe"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>

                <h2 className="gallery-videos-page-video-title">
                    The Unhealthy habits Taqadam Video
                </h2>
            </div>

        </div>
    </div>
  );
}

export default Videos;