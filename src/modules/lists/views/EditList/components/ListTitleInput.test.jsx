import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { faker } from '@faker-js/faker'
import ListTitleInput from './ListTitleInput'

const input = () => document.querySelector('input[name="title"]')

function renderInput(props = {}) {
  const onSave = vi.fn()
  const title = faker.lorem.words(2)
  render(<ListTitleInput title={title} onSave={onSave} {...props} />)
  return { onSave, title }
}

describe('ListTitleInput', () => {
  it('saves the trimmed title on blur', async () => {
    const user = userEvent.setup()
    const { onSave } = renderInput()
    const next = faker.lorem.words(3)

    await user.clear(input())
    await user.type(input(), `  ${next} `)
    await user.tab()

    expect(onSave).toHaveBeenCalledWith(next)
  })

  it('saves on Enter', async () => {
    const user = userEvent.setup()
    const { onSave } = renderInput()
    const next = faker.lorem.words(3)

    await user.clear(input())
    await user.type(input(), `${next}{Enter}`)

    expect(onSave).toHaveBeenCalledWith(next)
  })

  it('reverts a blank title instead of saving it', async () => {
    const user = userEvent.setup()
    const { onSave, title } = renderInput()

    await user.clear(input())
    await user.tab()

    expect(onSave).not.toHaveBeenCalled()
    expect(input()).toHaveValue(title)
  })

  it('does not save an unchanged title', async () => {
    const user = userEvent.setup()
    const { onSave } = renderInput()

    await user.click(input())
    await user.tab()

    expect(onSave).not.toHaveBeenCalled()
  })

  it('shows an alert when saving failed', () => {
    renderInput({ hasError: true })

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
