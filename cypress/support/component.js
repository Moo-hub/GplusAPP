// Ensure React is globally available for component testing
import React from 'react';
import { mount } from 'cypress/react';
import './commands';

// Register the mount command
Cypress.Commands.add('mount', mount);

// Add more component test helpers here
// This file is only used when running component tests