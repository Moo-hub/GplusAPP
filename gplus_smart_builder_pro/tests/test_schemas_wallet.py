from gplus_smart_builder_pro.src.schemas.wallet import Wallet, WalletBase, WalletCreate

def test_wallet_base():
    wallet = WalletBase(balance=100.0)
    assert wallet.balance == 100.0

def test_wallet_create():
    wallet = WalletCreate(balance=50.0)
    assert isinstance(wallet, WalletBase)

def test_wallet():
    wallet = Wallet(id=1, balance=200.0)
    assert wallet.id == 1
