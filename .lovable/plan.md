

# Diagnostico: Push Notifications nao funcionam

## Problema identificado

Analisei os dados de debug salvos no banco de dados de **todos os usuarios reais** e encontrei os problemas exatos:

### Android: Plugin nao registrado (100% dos usuarios Android falham)
```text
Erro: "PushNotifications" plugin is not implemented on android
```
**Causa raiz**: O arquivo `android/capacitor.settings.gradle` (gerado automaticamente pelo `npx cap sync`) nao inclui o plugin `@capacitor/push-notifications`. O arquivo atual so tem `capacitor-android`:
```text
include ':capacitor-android'
project(':capacitor-android').projectDir = ...
```
O `capacitor.build.gradle` tambem tem `dependencies {}` vazio.

Isso significa que o `npx cap sync android` nao esta registrando o plugin corretamente. O plugin existe no `package.json`, mas nao esta sendo sincronizado para o projeto nativo.

**Solucao**: Voce precisa rodar estes comandos no seu computador local (nao no Lovable):
```bash
npm install
npx cap sync android
```
Depois confirme que o arquivo `android/capacitor.settings.gradle` agora inclui uma linha para `capacitor-push-notifications`. Se nao incluir, rode:
```bash
npx cap update android
```

### iOS: Problemas mistos

| Status | Qtd usuarios | Significado |
|--------|-------------|-------------|
| `registration_error: aps-environment` | 3 | Provisioning Profile no Apple Developer nao tem Push Notifications habilitado |
| `no_token_after_register` | 5 | Registro chamado mas token nunca retornou (consequencia do aps-environment ou GoogleService-Info.plist ausente) |
| `permission_denied` | 2 | Usuario negou permissao (normal) |
| `token_saved` | 1 | Funcionou (somente o Super Admin) |

**Causa raiz iOS**: O erro `aps-environment` indica que o **Provisioning Profile** usado para assinar o app no Codemagic nao tem a capability "Push Notifications" habilitada no Apple Developer Portal.

**Solucao iOS**:
1. Acesse developer.apple.com → Certificates, Identifiers & Profiles
2. Em **Identifiers**, selecione `app.morador.app`
3. Marque **Push Notifications** como habilitado
4. Regenere o Provisioning Profile (Distribution)
5. Atualize o profile no Codemagic
6. Confirme que o `GoogleService-Info.plist` esta no Codemagic como variavel de ambiente (`GOOGLE_SERVICE_INFO_PLIST` em base64) - o codemagic.yaml ja decodifica ele

### Resumo da situacao atual
```text
Tokens salvos no banco: 1 (apenas Super Admin iOS)
Android: 0 tokens (plugin nao instalado no build nativo)
iOS: 0 tokens de moradores (provisioning profile sem push)
```

## O que eu posso fazer aqui no Lovable

O codigo JavaScript (frontend + edge function) esta **correto** e ja funciona - prova disso e que o Super Admin conseguiu salvar o token. Os problemas sao 100% de configuracao nativa:

1. **Android**: `npx cap sync` precisa ser rodado localmente para registrar o plugin
2. **iOS**: Provisioning Profile precisa ser atualizado no Apple Developer Portal

Nenhuma mudanca de codigo e necessaria. O problema e exclusivamente de build nativo.

## Passos para resolver

1. **Android**: No terminal local, rode `npm install && npx cap sync android`, confirme que `capacitor.settings.gradle` agora lista o plugin push, e faca um novo build
2. **iOS**: Habilite Push Notifications no Apple Developer Portal para o App ID `app.morador.app`, regenere o provisioning profile, atualize no Codemagic, e faca um novo build
3. Depois de instalar os novos builds, faca login e verifique no banco se novos tokens aparecem

