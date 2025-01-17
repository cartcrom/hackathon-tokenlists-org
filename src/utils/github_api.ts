import { Octokit } from '@octokit/core'
import { createPullRequest } from './pr-plugin'
import { Changes } from './pr-plugin/types'
import { TokenList } from './tokenListUpdater'

const MyOctokit = Octokit.plugin(createPullRequest)

export function tokenListToRepoName(listName: TokenList): string {
  switch (listName) {
    case TokenList.UNISWAP_DEFAULT:
      return 'default-token-list'
    case TokenList.UNISWAP_EXTENDED:
      return 'extended-token-list'
    case TokenList.UNISWAP_UNSUPPORTED:
      return 'unsupported-token-list'
    default:
      throw new Error('Unknown list name')
  }
}

export function uploadFileApi(listName: TokenList, changes: Changes[], accessToken: string) {
  const octokit = new MyOctokit({ auth: accessToken })

  const date = new Date().toDateString();
  const unix = Date.now() / 1000;

    octokit
    .createPullRequest({
      owner: 'Uniswap',
      repo: tokenListToRepoName(listName),
      title: `(test) list update - ${date}`,
      body: '',
      head: `list-update-${unix}`,
      base: 'main' /* optional: defaults to default branch */,
      update: false /* optional: set to `true` to enable updating existing pull requests */,
      forceFork: false /* optional: force creating fork even when user has write rights */,
      changes: changes,
    })
    .then((pr) => pr?.url && window.open(pr.url, '_token_editor_pr'))
}
