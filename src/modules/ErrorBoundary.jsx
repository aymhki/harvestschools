import React from 'react';
import PropTypes from "prop-types";

class ErrorBoundary extends React.Component {
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
					<h2>Something went wrong</h2>
					<p>Please refresh the page to continue.</p>
					<button
						onClick={() => window.location.reload()}
					>
						Refresh Page
					</button>
				</div>
			);
		}
		
		return this.props.children;
	}
}

export default ErrorBoundary;



ErrorBoundary.propTypes = {
	children: PropTypes.node.isRequired,
}

