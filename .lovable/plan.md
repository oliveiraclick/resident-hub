

# Diagnóstico e Correção: Push Notifications com 0 tokens registrados

## Problema Raiz

O app usa `server.url` no Capacitor apontando para a URL publicada (`https://morador-hub.lovable.app?native=1`). Isso significa que o código JavaScript roda **dentro de uma WebView carregando uma URL remota**, e NÃO localmente. Nesse cenário, o plugin `@capacitor/push-notifications` **não consegue se comunicar com a bridge nativa do Capacitor**, pois a bridge só funciona com conteúdo servido localmente (de `dist/`).

Resultado: `PushNotifications.register()` nunca dispara o evento `registration`, ou lança erro silencioso, e nenhum token é salvo.

## Causa Secundária (iOS)

O `AppDelegate.swift` não registra para notificações remotas. No iOS, é obrigatório chamar `application.registerForRemoteNotifications()` e implementar `didRegisterForRemoteNotificationsWithDeviceToken` para repassar o token ao Capacitor.

## Plano de Correção

### 1. Atualizar `AppDelegate.swift` (iOS)
Adicionar registro de notificações remotas e delegates APNs para que o Capacitor receba o token:

```swift
func application(_ application: UIApplication, didFinishLaunchingWithOptions ...) -> Bool {
    UNUserNotificationCenter.current().delegate = self
    application.registerForRemoteNotifications()
    return true
}

func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
}

func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
}
```

E estender `UNUserNotificationCenterDelegate`.

### 2. Adicionar logs de debug mais detalhados no `usePushNotifications.ts`
Para diagnosticar se a bridge está funcionando na WebView remota, adicionar logs em cada etapa (permissão, registro, token recebido, erro).

### 3. Adicionar fallback de detecção nativa
O hook atual já tem fallback via `?native=1` e user-agent. Manter isso, mas adicionar logs claros para cada check.

### 4. Verificar constraint UNIQUE no upsert
A tabela tem `UNIQUE(user_id, token)` e o upsert usa `onConflict: "user_id,token"` - isso está correto.

## Importante para o Usuário

Após estas mudanças no código:
1. Fazer `git pull` no projeto local
2. Rodar `npx cap sync` para sincronizar mudanças nativas
3. Rebuildar o app no Xcode/Android Studio
4. A chave APNs (.p8) precisa estar configurada no Firebase Console (conforme memória existente: Key ID H4Y338B589, Team ID AR9789SH9Q)

## Arquivos a Modificar
- `ios/App/App/AppDelegate.swift` — adicionar delegates APNs
- `src/hooks/usePushNotifications.ts` — adicionar logs detalhados de debug

