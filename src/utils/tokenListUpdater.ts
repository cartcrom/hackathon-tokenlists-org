import { TokenInfo } from '@uniswap/token-lists'
import axios from 'axios'
import { tokenListToRepoName, uploadFileApi } from './github_api'
import { Changes } from './pr-plugin/types'
import semver from 'semver'
export enum TokenList {
  UNISWAP_DEFAULT,
  UNISWAP_EXTENDED,
  UNISWAP_UNSUPPORTED,
}

export const getTokenList = (listName: string) => {
  if (listName.toLowerCase().includes('default')) return TokenList.UNISWAP_DEFAULT
  if (listName.toLowerCase().includes('extended')) return TokenList.UNISWAP_EXTENDED
  if (listName.toLowerCase().includes('unsupported')) return TokenList.UNISWAP_UNSUPPORTED
  return TokenList.UNISWAP_DEFAULT
}

export const getTokenListDisplayName = (tokenList: TokenList) => {
  switch (tokenList) {
    case TokenList.UNISWAP_DEFAULT:
      return 'Uniswap Labs Default'
    case TokenList.UNISWAP_EXTENDED:
      return 'Uniswap Labs Extended'
    case TokenList.UNISWAP_UNSUPPORTED:
      return 'Unsupported Tokens'
  }
}
export enum Chain {
  MAINNET = 1,
  ROPSTEN = 3,
  RINKEBY = 4,
  GOERLI = 5,
  KOVAN = 42,
  POLYGON = 137,
  ARBITRUM = 42161,
  OPTIMISM = 10,
  CELO = 42220,
}

  export const TOKENLIST_URLS: { [key: string]:  { [key: number]: string } } = {
    [TokenList.UNISWAP_DEFAULT]: {
        [Chain.MAINNET]: 'https://raw.githubusercontent.com/Uniswap/default-token-list/main/src/tokens/mainnet.json',
        [Chain.ARBITRUM]: 'https://raw.githubusercontent.com/Uniswap/default-token-list/main/src/tokens/arbitrum.json',
        [Chain.POLYGON]: 'https://raw.githubusercontent.com/Uniswap/default-token-list/main/src/tokens/polygon.json',
        [Chain.OPTIMISM]: 'https://raw.githubusercontent.com/Uniswap/default-token-list/main/src/tokens/optimism.json',
        [Chain.CELO]:   'https://raw.githubusercontent.com/Uniswap/default-token-list/main/src/tokens/celo.json',
        [Chain.ROPSTEN]: 'https://raw.githubusercontent.com/Uniswap/default-token-list/main/src/tokens/ropsten.json',
        [Chain.RINKEBY]: 'https://raw.githubusercontent.com/Uniswap/default-token-list/main/src/tokens/rinkeby.json',
        [Chain.GOERLI]: 'https://raw.githubusercontent.com/Uniswap/default-token-list/main/src/tokens/goerli.json',
        [Chain.KOVAN]: 'https://raw.githubusercontent.com/Uniswap/default-token-list/main/src/tokens/kovan.json',
    },
    [TokenList.UNISWAP_EXTENDED]: {
        [Chain.MAINNET]: 'https://raw.githubusercontent.com/Uniswap/extended-token-list/main/src/tokens/mainnet.json',
        [Chain.ARBITRUM]: 'https://raw.githubusercontent.com/Uniswap/extended-token-list/main/src/tokens/arbitrum.json',
        [Chain.POLYGON]: 'https://raw.githubusercontent.com/Uniswap/extended-token-list/main/src/tokens/polygon.json',
        [Chain.OPTIMISM]: 'https://raw.githubusercontent.com/Uniswap/extended-token-list/main/src/tokens/optimism.json',
        [Chain.CELO]:   'https://raw.githubusercontent.com/Uniswap/extended-token-list/main/src/tokens/celo.json',
        [Chain.ROPSTEN]: 'https://raw.githubusercontent.com/Uniswap/extended-token-list/main/src/tokens/ropsten.json',
        [Chain.RINKEBY]: 'https://raw.githubusercontent.com/Uniswap/extended-token-list/main/src/tokens/rinkeby.json',
        [Chain.GOERLI]: 'https://raw.githubusercontent.com/Uniswap/extended-token-list/main/src/tokens/goerli.json',
        [Chain.KOVAN]: 'https://raw.githubusercontent.com/Uniswap/extended-token-list/main/src/tokens/kovan.json',
    },
    [TokenList.UNISWAP_UNSUPPORTED]: {
        [Chain.MAINNET]: 'https://raw.githubusercontent.com/Uniswap/unsupported-token-list/main/src/tokens/mainnet.json',
        //[Chain.ARBITRUM]: 'https://raw.githubusercontent.com/Uniswap/default-token-list/main/src/tokens/arbitrum.json',
        [Chain.POLYGON]: 'https://raw.githubusercontent.com/Uniswap/unsupported-token-list/main/src/tokens/polygon.json',
       // [Chain.OPTIMISM]: 'https://raw.githubusercontent.com/Uniswap/unsupported-token-list/main/src/tokens/optimism.json',
       //[Chain.CELO]:   'https://raw.githubusercontent.com/Uniswap/unsupported-token-list/main/src/tokens/celo.json',
        [Chain.ROPSTEN]: 'https://raw.githubusercontent.com/Uniswap/unsupported-token-list/main/src/tokens/ropsten.json',
        [Chain.RINKEBY]: 'https://raw.githubusercontent.com/Uniswap/unsupported-token-list/main/src/tokens/rinkeby.json',
        [Chain.GOERLI]: 'https://raw.githubusercontent.com/Uniswap/unsupported-token-list/main/src/tokens/goerli.json',
        [Chain.KOVAN]: 'https://raw.githubusercontent.com/Uniswap/unsupported-token-list/main/src/tokens/kovan.json',
    }        
  }

export enum ChangeType {
  EDIT,
  REMOVE,
  ADD,
}

export interface TokenChange {
  actionType: ChangeType
  newTokenInfo?: TokenInfo // required for ADD and EDIT
}

const chainToTokenArrayMap = new Map<number, Map<string, TokenInfo>>()
const chainsToUpdate = new Set<number>()

function getTokenCompositeKey(chainId: number, address: String) {
  return `${chainId}_${address.toLowerCase()}`
}

export function getTokenChange(changeType: ChangeType, token: TokenInfo) {
  const tokenChangeKey = token.chainId + '_' + token.address
  if (changeType === ChangeType.REMOVE) {
    return {
      tokenChangeKey,
      tokenChangeValue: {
        actionType: ChangeType.REMOVE,
      },
    }
  } else {
    return {
      tokenChangeKey,
      tokenChangeValue: {
        actionType: changeType === ChangeType.EDIT ? ChangeType.EDIT : ChangeType.ADD,
        newTokenInfo: token,
      },
    }
  }
}

function parseTokenCompositeKey(key: string) {
  const [chainId, address] = key.split('_')
  return { chainId: parseInt(chainId), address: address.toLowerCase() }
}

// tokenChangesMap: chainid_tokenaddress -> TokenInfo
export async function updateList(listName: TokenList, tokenChangesMap: Map<string, TokenChange>, accessToken: string) {
    tokenChangesMap.forEach((change, key) => {
        key = key.toLowerCase()
        const { chainId } = parseTokenCompositeKey(key)
        chainsToUpdate.add(chainId)
    })

    await fetch(listName)
    let didRemoveOrEdit = false
    tokenChangesMap.forEach((change, key) => {
        key = key.toLowerCase()
        const tokenMap = chainToTokenArrayMap.get(parseTokenCompositeKey(key).chainId)

        if (change.actionType === ChangeType.REMOVE) {
            if(!tokenMap?.has(key)) {
                throw new Error(`Token ${key} not found in list`)
            }
            didRemoveOrEdit = true
            tokenMap.delete(key)
        } else if (change.actionType === ChangeType.ADD) {
            if(tokenMap?.has(key)) {
                throw new Error(`Token ${key} already exists in list`)
            }
            if(!change.newTokenInfo) {
                throw new Error(`missing newTokenInfo for token ${key}`)
            }
            const {extensions, ...tokenWithoutExtensions} = change.newTokenInfo

            tokenMap!.set(key, tokenWithoutExtensions)
        } else if (change.actionType === ChangeType.EDIT) {
            if(!tokenMap?.has(key)) {
                throw new Error(`Token ${key} not found in list`)
            }
            if(!change.newTokenInfo) {
                throw new Error(`missing newTokenInfo for token ${key}`)
            }
            const {extensions, ...tokenWithoutExtensions} = change.newTokenInfo

            didRemoveOrEdit = true
            tokenMap!.set(key, tokenWithoutExtensions)
        }
    })
    const chainToUpdatedTokensMap = new Map<Chain, TokenInfo[]>()
    chainToTokenArrayMap.forEach((tokenMap, chain) => {
        chainToUpdatedTokensMap.set(chain, Array.from(tokenMap.values()).map(token => { return {...token,
            address: token.address.toLowerCase()}}))
    })

  const chainToTokenInfoMap = new Map<Chain, TokenInfo[]>()
  chainToTokenArrayMap.forEach((tokenMap, chain) => {
    chainToTokenInfoMap.set(chain, Array.from(tokenMap.values()))
  })
  const changes: Changes[] = []
  const str = JSON.stringify((await updateVersionAndGetPackageFile(listName, didRemoveOrEdit)), null, 2)
  const packageJsonObjEncoded = unescape(encodeURIComponent(str))

  chainToTokenInfoMap.forEach((tokenInfo, chain) => {
    const fileName: string = getFileName(chain)
    const filePath = `src/tokens/${fileName}`
    const encoded = btoa(JSON.stringify(tokenInfo, null, 2))

    const change: Changes = {
      /* optional: if `files` is not passed, an empty commit is created instead */
      files: {
        [filePath]: {
          content: encoded,
          encoding: 'base64',
        },
      },
      commit: `update list - ${Chain[chain]}`,
    }
    changes.push(change)
  })

  changes.push({
    files: {
      "package.json": {
        content: packageJsonObjEncoded,
        encoding: 'utf-8',
      },
    },
    commit: `update list version`,
  })
  uploadFileApi(listName, changes, accessToken)
}

export async function fetch(tokenListName: TokenList) {
  const urls = TOKENLIST_URLS[tokenListName]
  const promises = []
  for (const chainId of Object.keys(urls)) {
    if(chainsToUpdate.has(parseInt(chainId))) {
    const url = urls[parseInt(chainId)]
    promises.push(
      axios.get(url).then((response) => {
        return { response: response.data, chain: parseInt(chainId) }
      })
    )
    }
  }
  const result = await Promise.all(promises)
  result.forEach((res) => {
    const tokenInfoMap = new Map<string, TokenInfo>()

    res.response.forEach((token: TokenInfo) => {
      tokenInfoMap.set(getTokenCompositeKey(token.chainId, token.address), token)
    })
    chainToTokenArrayMap.set(res.chain, tokenInfoMap)
  })
}

export function getFileName(chain: Chain): string {
  switch (chain) {
    case Chain.MAINNET:
      return 'mainnet.json'
    case Chain.RINKEBY:
      return 'rinkeby.json'
    case Chain.ROPSTEN:
      return 'ropsten.json'
    case Chain.KOVAN:
      return 'kovan.json'
    case Chain.GOERLI:
      return 'goerli.json'
    case Chain.POLYGON:
      return 'polygon.json'
    case Chain.OPTIMISM:
      return 'optimism.json'
    case Chain.CELO:
      return 'celo.json'
    case Chain.ARBITRUM:
      return 'arbitrum.json'
  }
}

export async function updateVersionAndGetPackageFile(tokenListName: TokenList, didRemoveOrEdit: boolean){
    const packageFileUrl = `https://raw.githubusercontent.com/Uniswap/${tokenListToRepoName(tokenListName)}/main/package.json`
    let packageJsonObj = (await axios.get(packageFileUrl)).data
     packageJsonObj = {
        ...packageJsonObj,
        version: didRemoveOrEdit ? semver.inc(packageJsonObj.version, 'major') : semver.inc(packageJsonObj.version, 'minor'),
    }
    return packageJsonObj
}
