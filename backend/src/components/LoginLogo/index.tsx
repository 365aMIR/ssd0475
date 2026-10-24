import React from 'react';

// The southsidedinero logo on the admin login screen.
const LoginLogo: React.FC = () => {
    return (
        <div className="login-logo">
            <img
                src="/assets/logo.png"
                alt="southsidedinero"
                width="300"
                height="150"
            />
        </div>
    );
};

export default LoginLogo;
