import importlib
m = importlib.import_module('app.main')
print('app imported')
paths = list(m.app.openapi().get('paths',{}).keys())
print('/api/v1/environmental/impacts' in paths)
print('tags:', [t['name'] for t in m.app.openapi().get('tags',[])])
