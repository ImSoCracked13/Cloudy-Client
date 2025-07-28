import { Component, JSX } from 'solid-js';
import { AuthHandler } from '../handlers/AuthHandler';
import { FileHandler } from '../handlers/FileHandler';
import ProtectedRoute from '../blocks/auth/ProtectedState';

interface ProtectedWrapperProps {
  children: JSX.Element;
  redirectTo?: string;
}

const ProtectedWrapper: Component<ProtectedWrapperProps> = (props) => {
  return (
    <AuthHandler>
      <ProtectedRoute redirectTo={props.redirectTo}>
        <FileHandler>
          {props.children}
        </FileHandler>
      </ProtectedRoute>
    </AuthHandler>
  );
};

export default ProtectedWrapper; 