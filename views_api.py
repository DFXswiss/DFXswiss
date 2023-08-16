import hashlib
from http import HTTPStatus
from urllib.parse import urlparse

import httpx
from bech32 import bech32_encode, convertbits
from fastapi import Request
from loguru import logger
from starlette.exceptions import HTTPException

from . import dfxswiss_ext


@dfxswiss_ext.get("/api/v1/encode_lndhub/{invoiceKey}")
async def api_encode_lndhub(invoiceKey: str, request: Request):
  urlComponents = urlparse(str(request.url))

  link = f"lndhub://invoice:{invoiceKey}@{urlComponents.scheme}://{urlComponents.netloc}/lndhub/ext/"

  bech32_data = convertbits(link.encode(), 8, 5, True)
  assert bech32_data
  lnurl = bech32_encode("lnurl", bech32_data)
  return lnurl.upper().replace('LNURL', 'LNDHUB')

@dfxswiss_ext.get("/api/v1/signIn/{address}")
async def api_sign_in(address: str):
  url = 'https://api.dfx.swiss/v1/auth/signIn'
  signature = createSignature(address)

  data = {
    "address": address,
    "signature": signature
  }

  try:
    async with httpx.AsyncClient() as client:
      resp = await client.post(url, data=data, timeout=30)
      resp.raise_for_status()
      return resp.json()
  except httpx.HTTPStatusError:
    return await api_sign_up(address)
  except Exception as ex:
    logger.warning(ex)
    raise HTTPException(
            detail="DFX.swiss SignIn: Invalid address", status_code=HTTPStatus.FORBIDDEN
    )

@dfxswiss_ext.get("/api/v1/signUp/{address}")
async def api_sign_up(address: str):
  url = 'https://api.dfx.swiss/v1/auth/signUp'
  signature = createSignature(address)

  data = {
    "address": address,
    "signature": signature
  }

  try:
    async with httpx.AsyncClient() as client:
      resp = await client.post(url, data=data, timeout=30)
      resp.raise_for_status()
      return resp.json()
  except Exception as ex:
    logger.warning(ex)
    raise HTTPException(
            detail="DFX.swiss SignUp: Invalid address", status_code=HTTPStatus.FORBIDDEN
    )

def createSignature(address: str) -> str:
    hash = hashlib.sha256()
    hash.update(address.encode())
    signature = hash.hexdigest()
    return signature + '0a1b2c3d4e5f6789' + signature
