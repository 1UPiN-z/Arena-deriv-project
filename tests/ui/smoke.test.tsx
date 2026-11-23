import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../../src/pages/HomePage';
import { LearnPage } from '../../src/pages/LearnPage';
import { AboutPage } from '../../src/pages/AboutPage';
import { SignupPage } from '../../src/pages/AuthPages';
import { BotDashboardPage } from '../../src/pages/bot/BotDashboardPage';
import { BotTutorialsPage } from '../../src/pages/bot/BotTutorialsPage';

describe('UI smoke tests', () => {
  it('renders the homepage hero and sections', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Anyone')).toBeTruthy();
    expect(screen.getByText('All your markets in one place')).toBeTruthy();
    expect(screen.getByText('Trade the way you want')).toBeTruthy();
    expect(screen.getAllByText('Open account').length).toBeGreaterThan(0);
  });

  it('renders the learn page with FAQ', () => {
    render(
      <MemoryRouter>
        <LearnPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Frequently asked questions')).toBeTruthy();
  });

  it('renders the about page with risk disclaimer', () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Risk disclaimer')).toBeTruthy();
  });

  it('renders the signup form', () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByText('Sign up')).toBeTruthy();
  });

  it('renders the bot dashboard tiles', async () => {
    render(
      <MemoryRouter>
        <BotDashboardPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Load or build your bot')).toBeTruthy();
    expect(screen.getByText('Bot Builder')).toBeTruthy();
    expect(screen.getByText('Quick strategy')).toBeTruthy();
  });

  it('renders bot tutorials', () => {
    render(
      <MemoryRouter>
        <BotTutorialsPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Tutorials')).toBeTruthy();
    expect(screen.getAllByText(/Run the bot/i).length).toBeGreaterThan(0);
  });
});
