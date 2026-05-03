import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('App', () => {
  it('shows the availability shell and navigates to settings', async () => {
    const user = userEvent.setup()

    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Book a one-hour cable slot' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pro' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(screen.getByRole('button', { name: 'Settings' }))

    expect(
      screen.getByRole('heading', { name: 'Booking details' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Season pass code')).toBeInTheDocument()
  })
})
