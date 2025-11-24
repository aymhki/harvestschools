import React from 'react';
import PropTypes from "prop-types";
import { useTranslation } from 'react-i18next';


class ErrorBoundaryClass extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false };
	}
	
	static getDerivedStateFromError(error) {
		return { hasError: true };
	}
	
	componentDidCatch(error, errorInfo) {
		if (
			error.message.includes('Failed to fetch dynamically imported module') ||
			error.message.includes('Importing a module script failed') ||
			error.message.includes('Loading chunk') ||
			error.message.includes('Loading CSS chunk')
		) {
			console.log('Dynamic import error detected, reloading page...');
			
			const currentPath = window.location.pathname + window.location.search;
			
			if (currentPath && currentPath !== '/') {
				window.location.href = currentPath;
			} else {
				window.location.reload();
			}
			
			return;
		}
		
		console.error('ErrorBoundary caught an error:', error, errorInfo);
	}
	
	render() {
        const { t } = this.props;

        if (this.state.hasError) {
			return (
				<div style={{
					padding: '20px',
					textAlign: 'center',
					minHeight: '50vh',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center'
				}}>
					<h2>{t("error-boundary-page.title")}</h2>
					<p>{t("error-boundary-page.please-refresh-the-page-to-continue")}</p>
					<button
						onClick={() => window.location.reload()}
					>
						{t("error-boundary-page.refresh-page-btn")}
					</button>
				</div>
			);
		}
		
		return this.props.children;
	}
}

ErrorBoundaryClass.propTypes = {
    children: PropTypes.node.isRequired,
    t: PropTypes.func.isRequired,
};

const ErrorBoundary = ({ children }) => {
    const { t } = useTranslation();
    return <ErrorBoundaryClass t={t}>{children}</ErrorBoundaryClass>;
};

export default ErrorBoundary;

ErrorBoundary.propTypes = {
	children: PropTypes.node.isRequired,
}
