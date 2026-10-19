from .models import JournalAudit


def enregistrer_audit(
    utilisateur,
    module,
    action,
    description,
    reference='',
):
    """
    Enregistre une action dans le journal d'audit.

    Cette fonction centralise la création des traces
    afin d'éviter de répéter le même code dans les vues.
    """

    return JournalAudit.objects.create(
        utilisateur=utilisateur,
        module=module,
        action=action,
        description=description,
        reference=reference or '',
    )