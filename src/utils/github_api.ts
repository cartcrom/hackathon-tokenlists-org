import { Octokit } from '@octokit/core'
import { createPullRequest } from './pr-plugin'
import { Changes } from './pr-plugin/types'

const MyOctokit = Octokit.plugin(createPullRequest)

export function uploadFileApi(changes: Changes[], accessToken: string) {
  const octokit = new MyOctokit({ auth: accessToken })

  octokit
    .createPullRequest({
      owner: 'Uniswap',
      repo: 'default-token-list',
      title: 'test pr 3',
      body: 'test',
      head: 'test-octokit',
      base: 'main' /* optional: defaults to default branch */,
      update: true /* optional: set to `true` to enable updating existing pull requests */,
      forceFork: false /* optional: force creating fork even when user has write rights */,
      changes: changes,
    })
    .then((pr) => pr?.url && window.open(pr.url, '_token_editor_pr'))
}
