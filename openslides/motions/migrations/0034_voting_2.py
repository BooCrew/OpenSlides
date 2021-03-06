# Generated by Finn Stutzenstein on 2019-10-30 13:43

from django.db import migrations


def change_pollmethods(apps, schema_editor):
    """ yn->YN, yna->YNA """
    MotionPoll = apps.get_model("motions", "MotionPoll")
    pollmethod_map = {
        "yn": "YN",
        "yna": "YNA",
    }
    for poll in MotionPoll.objects.all():
        poll.pollmethod = pollmethod_map.get(poll.pollmethod, "YNA")
        poll.save(skip_autoupdate=True)


def set_poll_titles(apps, schema_editor):
    """
    Sets titles to their indexes
    """
    Motion = apps.get_model("motions", "Motion")
    for motion in Motion.objects.all():
        for i, poll in enumerate(motion.polls.order_by("pk").all()):
            poll.title = str(i + 1)
            poll.save(skip_autoupdate=True)


def set_onehunderd_percent_bases(apps, schema_editor):
    MotionPoll = apps.get_model("motions", "MotionPoll")
    ConfigStore = apps.get_model("core", "ConfigStore")
    base_map = {
        "YES_NO_ABSTAIN": "YNA",
        "YES_NO": "YN",
        "VALID": "valid",
        "CAST": "cast",
        "DISABLED": "disabled",
    }
    try:
        config = ConfigStore.objects.get(key="motions_poll_100_percent_base")
        value = base_map[config.value]
    except (ConfigStore.DoesNotExist, KeyError):
        value = "YNA"

    for poll in MotionPoll.objects.all():
        # The pollmethod is new (default is YNA), so we do not need
        # to check, if the 100% base is valid.
        poll.onehundred_percent_base = value
        poll.save(skip_autoupdate=True)


def set_majority_methods(apps, schema_editor):
    MotionPoll = apps.get_model("motions", "MotionPoll")
    ConfigStore = apps.get_model("core", "ConfigStore")
    majority_map = {
        "simple_majority": "simple",
        "two-thirds_majority": "two_thirds",
        "three-quarters_majority": "three_quarters",
        "disabled": "disabled",
    }
    try:
        config = ConfigStore.objects.get(key="motions_poll_default_majority_method")
        value = majority_map[config.value]
    except (ConfigStore.DoesNotExist, KeyError):
        value = "simple"

    for poll in MotionPoll.objects.all():
        poll.majority_method = value
        poll.save(skip_autoupdate=True)


def convert_votes(apps, schema_editor):
    MotionVote = apps.get_model("motions", "MotionVote")
    value_map = {
        "Yes": "Y",
        "No": "N",
        "Abstain": "A",
    }
    for vote in MotionVote.objects.all():
        if vote.value not in value_map.values():
            vote.value = value_map[vote.value]
            vote.save(skip_autoupdate=True)


def set_correct_state(apps, schema_editor):
    """ If there are votes, set the state to finished """
    MotionPoll = apps.get_model("motions", "MotionPoll")
    MotionVote = apps.get_model("motions", "MotionVote")
    for poll in MotionPoll.objects.all():
        if MotionVote.objects.filter(option__poll__pk=poll.pk).exists():
            poll.state = 3  # finished
            poll.save(skip_autoupdate=True)


class Migration(migrations.Migration):

    dependencies = [
        ("motions", "0033_voting_1"),
    ]

    operations = [
        migrations.RunPython(change_pollmethods),
        migrations.RunPython(set_poll_titles),
        migrations.RunPython(set_onehunderd_percent_bases),
        migrations.RunPython(set_majority_methods),
        migrations.RunPython(convert_votes),
        migrations.RunPython(set_correct_state),
    ]
