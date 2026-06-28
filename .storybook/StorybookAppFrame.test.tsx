import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StorybookAppFrame } from './StorybookAppFrame'

describe('StorybookAppFrame', () => {
  it('renders children inside the shared app frame container', () => {
    render(
      <StorybookAppFrame>
        <div data-testid="story-content">Story content</div>
      </StorybookAppFrame>,
    )

    const storyContent = screen.getByTestId('story-content')
    const frame = storyContent.parentElement

    expect(frame).not.toBeNull()
    expect(frame?.className).toContain('min-h-svh')
    expect(frame?.className).toContain('max-w-7xl')
    expect(frame?.className).toContain('px-4')
    expect(frame?.className).toContain('py-6')
  })
})
