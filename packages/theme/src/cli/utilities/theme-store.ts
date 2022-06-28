import {store as conf, error} from '@shopify/cli-kit'

export function getTheme(flags: {store: string | undefined}): string {
  const store = flags.store || conf.getTheme()
  if (!store) {
    throw new error.Abort('A store is required', 'Specify the store using --store={your_store}')
  }
  conf.setTheme(store)
  return store
}
