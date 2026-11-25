import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { faker } from '@faker-js/faker'
import { makeItem } from '@/test/factories'
import { toFormValues } from '../helpers/itemForm'
import ItemForm from './ItemForm'

const input = (name) => document.querySelector(`[name="${name}"]`)

function renderForm(props = {}) {
  const onSubmit = vi.fn()
  render(<ItemForm onSubmit={onSubmit} submitLabel="Añadir" {...props} />)
  return onSubmit
}

describe('ItemForm', () => {
  it('submits the cleaned-up item', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm()
    const title = faker.commerce.productName()
    const link = faker.internet.url()

    await user.type(input('title'), title)
    await user.type(input('buy_link'), link)
    await user.type(input('price'), '12,50')
    await user.type(input('section'), 'Spa')
    await user.click(screen.getByTestId('item-submit'))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title,
        buy_link: link,
        price: 12.5,
        section: 'Spa',
        subtitle: null,
        image_link: null,
      }),
    )
  })

  it('rejects a javascript: link and does not submit', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm()

    await user.type(input('title'), faker.commerce.productName())
    await user.type(input('buy_link'), 'javascript:alert(1)')
    await user.click(screen.getByTestId('item-submit'))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByTestId('buy_link-error')).toBeInTheDocument()
    expect(input('buy_link')).toHaveAttribute('aria-invalid', 'true')
  })

  it('requires a title and a buy link', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm()

    await user.click(screen.getByTestId('item-submit'))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByTestId('title-error')).toBeInTheDocument()
    expect(screen.getByTestId('buy_link-error')).toBeInTheDocument()
  })

  it('clears a field error once the field is edited', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByTestId('item-submit'))

    await user.type(input('title'), 'x')

    expect(screen.queryByTestId('title-error')).not.toBeInTheDocument()
  })

  it('rejects an image link that is not http(s)', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm()

    await user.type(input('title'), faker.commerce.productName())
    await user.type(input('buy_link'), faker.internet.url())
    await user.type(input('image_link'), 'data:image/png;base64,AAAA')
    await user.click(screen.getByTestId('item-submit'))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByTestId('image_link-error')).toBeInTheDocument()
  })

  it('starts from an existing item when editing', () => {
    const item = makeItem()
    renderForm({ initialValues: toFormValues(item) })

    expect(input('title')).toHaveValue(item.title)
    expect(input('buy_link')).toHaveValue(item.buy_link)
  })

  it('suggests the sections already in the list', () => {
    renderForm({ sections: ['Libros', 'Spa'] })

    const options = [
      ...document.querySelectorAll(
        `datalist#${CSS.escape(input('section').getAttribute('list'))} option`,
      ),
    ].map((option) => option.value)
    expect(options).toEqual(['Libros', 'Spa'])
  })

  it.each(['item_limit', 'unknown'])(
    'shows an alert for a %s error',
    (code) => {
      renderForm({ errorCode: code })

      expect(screen.getByRole('alert')).toBeInTheDocument()
    },
  )

  it('cancels', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    renderForm({ onCancel })

    await user.click(screen.getByTestId('item-cancel'))

    expect(onCancel).toHaveBeenCalled()
  })

  it('disables submit while saving', () => {
    renderForm({ isSubmitting: true })

    expect(screen.getByTestId('item-submit')).toBeDisabled()
  })
})
