// templates/frontend_react/src/store/store.js
{% if component_features.FrontendReact.redux_store %}
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';

export default configureStore({
  reducer: {
    counter: counterReducer,
  },
});
{% endif %}